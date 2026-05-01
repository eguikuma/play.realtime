import { createNativeHttpClient } from "@/libraries/transport";
import { origin } from "./environment";

export const http = createNativeHttpClient({ origin });
