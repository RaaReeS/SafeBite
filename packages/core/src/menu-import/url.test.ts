import { describe, expect, it } from "vitest";
import { checkMenuUrl, isPublicAddress } from "./url";

describe("isPublicAddress", () => {
  it.each([["8.8.8.8"], ["151.101.1.69"], ["2a00:1450:4003:80b::2004"], ["2606:4700::6810:84e5"]])(
    "%s es pública",
    (ip) => {
      expect(isPublicAddress(ip)).toBe(true);
    },
  );

  it.each([
    ["0.0.0.0", "«esta» red"],
    ["10.1.2.3", "privada 10/8"],
    ["100.64.0.1", "CGNAT"],
    ["100.127.255.255", "CGNAT (último)"],
    ["127.0.0.1", "local"],
    ["169.254.169.254", "enlace local (metadatos de la nube)"],
    ["172.16.0.1", "privada 172.16/12"],
    ["172.31.255.255", "privada 172.16/12 (último)"],
    ["192.0.0.8", "reservada IETF"],
    ["192.0.2.1", "documentación"],
    ["192.168.1.1", "privada 192.168/16"],
    ["198.18.0.1", "pruebas de red"],
    ["198.51.100.7", "documentación"],
    ["203.0.113.9", "documentación"],
    ["224.0.0.1", "multicast"],
    ["240.0.0.1", "reservada"],
    ["255.255.255.255", "difusión"],
    ["::", "sin especificar"],
    ["::1", "local IPv6"],
    ["fc00::1", "única local"],
    ["fd12:3456::1", "única local"],
    ["fe80::1", "enlace local IPv6"],
    ["febf::1", "enlace local IPv6 (último)"],
    ["ff02::1", "multicast IPv6"],
    ["::ffff:127.0.0.1", "IPv4 local dentro de IPv6"],
    ["::ffff:7f00:1", "IPv4 local dentro de IPv6 (hexadecimal)"],
    ["::ffff:10.0.0.1", "IPv4 privada dentro de IPv6"],
    ["64:ff9b::a00:1", "NAT64"],
    ["2001:db8::1", "documentación IPv6"],
  ])("%s no es pública (%s)", (ip) => {
    expect(isPublicAddress(ip)).toBe(false);
  });

  it("los rangos privados no tapan direcciones públicas vecinas", () => {
    expect(isPublicAddress("100.63.255.255")).toBe(true);
    expect(isPublicAddress("100.128.0.0")).toBe(true);
    expect(isPublicAddress("172.15.255.255")).toBe(true);
    expect(isPublicAddress("172.32.0.0")).toBe(true);
    expect(isPublicAddress("169.253.0.1")).toBe(true);
    expect(isPublicAddress("198.17.255.255")).toBe(true);
    expect(isPublicAddress("198.20.0.0")).toBe(true);
    expect(isPublicAddress("223.255.255.255")).toBe(true);
    expect(isPublicAddress("fbff::1")).toBe(true);
    expect(isPublicAddress("fec0::1")).toBe(true);
    expect(isPublicAddress("::ffff:8.8.8.8")).toBe(true);
  });

  it.each([
    ["8.254.0.1"],
    ["8.168.1.1"],
    ["192.169.0.1"],
    ["8.0.0.1"],
    ["192.1.0.1"],
    ["192.0.1.1"],
    ["8.18.0.1"],
    ["8.51.100.1"],
    ["8.8.100.1"],
    ["198.1.1.1"],
    ["198.51.101.1"],
    ["198.52.100.1"],
    ["8.8.113.1"],
    ["8.0.113.1"],
    ["203.1.1.1"],
    ["203.1.113.1"],
    ["203.0.114.1"],
  ])("%s, parecida a un rango privado, es pública", (ip) => {
    expect(isPublicAddress(ip)).toBe(true);
  });

  it.each([["64:1::1"], ["2a00:ff9b::1"], ["64:ff9a::1"], ["2001:db9::1"], ["2a00:db8::1"]])(
    "%s, parecida a NAT64 o documentación, es pública",
    (ip) => {
      expect(isPublicAddress(ip)).toBe(true);
    },
  );

  it("198.19.x (pruebas de red) tampoco es pública", () => {
    expect(isPublicAddress("198.19.0.1")).toBe(false);
  });

  it("lee bien la IPv4 dentro de IPv6 (cada cifra cuenta)", () => {
    expect(isPublicAddress("::ffff:93.184.216.34")).toBe(true);
    expect(isPublicAddress("::ffff:10.1.2.3")).toBe(false);
    expect(isPublicAddress("::ffff:192.0.2.1")).toBe(false);
    expect(isPublicAddress("::ffff:203.0.113.5")).toBe(false);
    expect(isPublicAddress("::1:0:0")).toBe(false);
    expect(isPublicAddress("2a00:1450:4003:80b::0:0:2004")).toBe(true);
  });

  it("entiende las formas completas y abreviadas de IPv6", () => {
    expect(isPublicAddress("2a00:1450:4003:080b:0000:0000:0000:2004")).toBe(true);
    expect(isPublicAddress("2a00:1450:4003:80b:0:0:8.8.8.8")).toBe(true);
    expect(isPublicAddress("2a00::8.8.8.8")).toBe(true);
    expect(isPublicAddress("0:0:0:0:0:ffff:127.0.0.1")).toBe(false);
    expect(isPublicAddress("::1.2.3.4")).toBe(false); // IPv4 «compatible» antigua
    expect(isPublicAddress("::ffff:256.0.0.1")).toBe(false);
    expect(isPublicAddress("1:2:3:4:5:6:7")).toBe(false);
    expect(isPublicAddress("1::2:3:4:5:6:7:8")).toBe(false);
    expect(isPublicAddress("1:2:3:4:5:6:7::8.8.8.8")).toBe(false);
    expect(isPublicAddress("12345::1")).toBe(false);
  });

  it.each([
    [""],
    ["no-es-ip"],
    ["1.2.3"],
    ["1.2.3.4.5"],
    ["256.1.1.1"],
    ["1.2.3.-1"],
    ["01.2.3.4"],
    ["1..2.3"],
    ["::g"],
    ["1:2:3:4:5:6:7:8:9"],
    [":::"],
    ["1::2::3"],
  ])("lo que no es una IP (%j) no es pública", (ip) => {
    expect(isPublicAddress(ip)).toBe(false);
  });
});

describe("checkMenuUrl", () => {
  it("acepta una dirección web normal", () => {
    const result = checkMenuUrl("  https://barpepe.es/carta  ");
    expect(result).toEqual({ ok: true, url: "https://barpepe.es/carta" });
    expect(checkMenuUrl("http://barpepe.es:80/carta.pdf")).toEqual({
      ok: true,
      url: "http://barpepe.es/carta.pdf",
    });
    expect(checkMenuUrl("https://8.8.8.8:443/")).toEqual({ ok: true, url: "https://8.8.8.8/" });
    expect(checkMenuUrl("https://[2a00:1450:4003:80b::2004]/carta")).toEqual({
      ok: true,
      url: "https://[2a00:1450:4003:80b::2004]/carta",
    });
  });

  it.each([
    ["", "invalid"],
    ["barpepe.es/carta", "invalid"],
    ["ftp://barpepe.es/carta", "protocol"],
    ["file:///etc/passwd", "protocol"],
    ["javascript:alert(1)", "protocol"],
    ["https://usuario:clave@barpepe.es/", "credentials"],
    ["https://usuario@barpepe.es/", "credentials"],
    ["https://:clave@barpepe.es/", "credentials"],
    ["https://barpepe.es:8080/", "port"],
    ["http://localhost/carta", "private"],
    ["http://intranet.localhost/", "private"],
    ["http://servidor.local/", "private"],
    ["http://metadata.internal/", "private"],
    ["http://intranet/", "private"],
    ["http://127.0.0.1/", "private"],
    ["http://169.254.169.254/latest/meta-data/", "private"],
    ["http://[::1]/", "private"],
    ["http://[::ffff:127.0.0.1]/", "private"],
    ["http://0x7f000001/", "private"],
    ["http://2130706433/", "private"],
  ])("rechaza %j (%s)", (input, reason) => {
    expect(checkMenuUrl(input)).toEqual({ ok: false, reason });
  });
});
