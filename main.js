import fetch from "node-fetch";
import { HttpsProxyAgent } from "https-proxy-agent";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import moment from 'moment-timezone'

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
  const dateTime = moment(new Date()).tz('Asia/Shanghai').format('YYYY-MM-DD h:m:s')

  const __dirname = path.resolve(path.dirname(""));
  // 日志文件路径
  const logFilePath = path.join(__dirname, "run.log");

  // 写入日志内容到文件
  const logContent = `${dateTime} - ${content}\n`;

  fs.appendFile(logFilePath, logContent, (err) => {
    if (err) {
      console.error("写入日志失败:", err);
      return;
    }

    // 成功写入日志后，读取并输出最后几行日志
    exec(`tail -n 1 ${logFilePath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`执行命令时出错: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
        return;
      }

      console.log("最新的日志内容:\n", stdout);
    });
  });
};

const main = async () => {
  const resp = await login();
  const checkResp = await checkout(resp.data.auth_data);
  wxSend(checkResp.message);
  saveLog(checkResp.message);
};

main();
