import fetch from "node-fetch";
import { HttpsProxyAgent } from "https-proxy-agent";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import moment from "moment-timezone";

const url = process.env.DOMAIN;
const email = process.env.EMAIL;
const password = process.env.PASSWORD;
const sendKey = process.env.SENDKEY;

const login = async () => {
  const resp = await fetch(`${url}/api/v1/passport/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  }).then((r) => r.json());
  return resp;
};

const checkout = async (token) => {
  const resp = await fetch(`${url}/skyapi?action=checkin`, {
    method: "GET",
    headers: {
      cookie: `auth=${token}`,
    },
  }).then((r) => r.json());
  return resp;
};

const wxSend = async (content) => {
  const resp = await fetch(
    `https://sctapi.ftqq.com/${sendKey}.send?title=${content}&desp=${content}`,
    {
      method: "POST",
    }
  ).then((r) => r.text());
};

const saveLog = (content) => {
  moment.tz.setDefault("Asia/Shanghai");
  const dateTime = moment(new Date())
    .tz("Asia/Shanghai")
    .format("YYYY-MM-DD h:m:s");

  const __dirname = path.resolve(path.dirname(""));
  // 日志文件路径
  const filePath = path.join(__dirname, "run.log");

  // 写入日志内容到文件
  const logContent = `${dateTime} - ${content}\n`;

  // 读取文件内容
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      return;
    }

    // 将插入内容与原文件内容合并
    const updatedContent = logContent + data;

    // 将更新后的内容写回文件
    fs.writeFile(filePath, updatedContent, "utf8", (err) => {
      if (err) {
        console.error("Error writing file:", err);
      } else {
        console.log(
          "Content successfully inserted at the beginning of the file."
        );
      }
    });
  });
};

const main = async () => {
  const resp = await login();
  const checkResp = await checkout(resp.data.auth_data);
  const content = JSON.stringify(checkResp);
  wxSend(content);
  saveLog(content);
};

main();
