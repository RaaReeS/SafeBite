import * as Location from "expo-location";
import { getCoordinatesIfAllowed, getCurrentCoordinates } from "./location";

jest.mock("expo-location", () => ({
  PermissionStatus: { GRANTED: "granted", DENIED: "denied", UNDETERMINED: "undetermined" },
  Accuracy: { Balanced: 3 },
  getForegroundPermissionsAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(async () => ({
    coords: { latitude: 40.4169, longitude: -3.7035 },
  })),
}));

const mockLocation = jest.mocked(Location);

beforeEach(() => jest.clearAllMocks());

describe("getCoordinatesIfAllowed", () => {
  it.each(["undetermined", "denied"])(
    "con el permiso %s devuelve null y NUNCA muestra el aviso de permiso",
    async (status) => {
      mockLocation.getForegroundPermissionsAsync.mockResolvedValueOnce({ status } as never);
      expect(await getCoordinatesIfAllowed()).toBeNull();
      expect(mockLocation.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
      expect(mockLocation.getCurrentPositionAsync).not.toHaveBeenCalled();
    },
  );

  it("con el permiso ya concedido devuelve la posición sin volver a preguntar", async () => {
    mockLocation.getForegroundPermissionsAsync.mockResolvedValueOnce({
      status: "granted",
    } as never);
    expect(await getCoordinatesIfAllowed()).toEqual({ latitude: 40.4169, longitude: -3.7035 });
    expect(mockLocation.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
  });

  it("si el GPS falla devuelve null", async () => {
    mockLocation.getForegroundPermissionsAsync.mockResolvedValueOnce({
      status: "granted",
    } as never);
    mockLocation.getCurrentPositionAsync.mockRejectedValueOnce(new Error("sin GPS"));
    expect(await getCoordinatesIfAllowed()).toBeNull();
  });
});

describe("getCurrentCoordinates", () => {
  it("pide el permiso (aviso de iOS) y devuelve la posición si se concede", async () => {
    mockLocation.requestForegroundPermissionsAsync.mockResolvedValueOnce({
      status: "granted",
    } as never);
    expect(await getCurrentCoordinates()).toEqual({
      status: "granted",
      coordinates: { latitude: 40.4169, longitude: -3.7035 },
    });
  });

  it("si se deniega, no consulta la posición", async () => {
    mockLocation.requestForegroundPermissionsAsync.mockResolvedValueOnce({
      status: "denied",
    } as never);
    expect(await getCurrentCoordinates()).toEqual({ status: "denied" });
    expect(mockLocation.getCurrentPositionAsync).not.toHaveBeenCalled();
  });
});
