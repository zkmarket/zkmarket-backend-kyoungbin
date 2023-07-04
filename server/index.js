import server from "./src/server";
import { ganacheDeploy } from "./src/contracts/deploy";

await ganacheDeploy();

server();