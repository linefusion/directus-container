#!/usr/bin/env node

import http from "node:http";
import { loadEnv } from "../common/env";

const { PORT } = loadEnv({
  PORT: 8055,
});

http.get(`http://127.0.0.1:${PORT}/server/info`, (res) => {
  console.log(res);
  process.exit(1);
});

process.exit(1);
