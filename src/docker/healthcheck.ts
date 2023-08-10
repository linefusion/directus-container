#!/usr/bin/env node

import http from "node:http";

const port = process.env.PORT || 8055;
http.get(`http://127.0.0.1:${port}/server/info`, (res) => {
  console.log(res);
  process.exit(1);
});

process.exit(1);
