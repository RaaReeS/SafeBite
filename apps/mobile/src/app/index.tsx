import { Redirect } from "expo-router";
import { useSession } from "@/lib/session";

/**
 * Ruta de entrada ("/"), accesible siempre: solo decide adónde ir. Sin ella, al
 * abrir la app sin sesión "/" no correspondería a ninguna pantalla disponible.
 */
export default function Index() {
  const { session, isRecoveringPassword } = useSession();
  const signedIn = session !== null && !isRecoveringPassword;
  return <Redirect href={signedIn ? "/inicio" : "/bienvenida"} />;
}
