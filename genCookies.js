const fs = require('fs');
const puppeteer = require('puppeteer');
const { authenticator } = require('otplib');
const delay = require('./delay')
const autoScroll = require('./scroll')

async function genCookies(username, password, code, port, ip, ipName, ipPassword) {
  const browser = await puppeteer.launch({
    headless: false,
    args: [ `--proxy-server=http://${ip}:${port}` ]
  });
  const page = await browser.newPage();
  await page.authenticate({username: ipName, password: ipPassword});
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36');
  // await page.setViewport({
  //   width: 1200,
  //   height: 800
  // });
  await delay(4,8)
  await page.goto('https://whoer.net/')
  await delay(4,8)

  await page.goto("https://mbasic.facebook.com");
  await delay(4, 8);
  try {
    // await autoScroll(page)
    await page.waitForSelector('button[name="accept_only_essential"][value="0"]');
    await page.click('button[name="accept_only_essential"][value="0"]');
  } catch (error) {
    console.log("Ip này không cần chia sẻ cookies")
  }
  await delay(4, 8);
  await page.waitForSelector('input[name="email"]',  { timeout: 3000});
  await page.type('input[name="email"]', username);

  await delay(4, 8);

  await page.waitForSelector('input[name="pass"]');
  await page.type('input[name="pass"]', password);
  await delay(4, 8);
  await page.keyboard.press('Enter');
  await delay(4,8)
  
  const approvals_code = authenticator.generate(code);
  await page.waitForSelector('input[name="approvals_code"]')
  await page.type('input[name="approvals_code"]', approvals_code);
  await delay(0.5,0,8)
  await page.keyboard.press('Enter');

  await page.waitForSelector('input[name="submit[Continue]"]')
  await page.click('input[name="submit[Continue]"]')

  await delay(4,8)
  const cookies = await page.cookies();
  const name_cookie = username+"|"+password+"|"+ip+"|"+port+"|"+ipName+"|"+ipPassword
  fs.writeFile(`cookies/${name_cookie}.json`, JSON.stringify(cookies), 'utf8', (err) => {
    if (err) {
      console.error('There was an error writing the file:', err);
      return;
    }
    console.log('File has been written successfully.');
  });
  await browser.close();
}

async function run() {
  fs.readFile('acc.txt', async (err, data1) => {
    if (err) {
      console.error(err);
      return;
    }

    const accounts = data1.toString().split('\n');
    fs.readFile('proxies.txt',async (err, data2) => {
      if (err) {
        console.log(err);
        return;
      }

      let response = [];
      const proxies = data2.toString().split('\n');
      for (let i = 0; i < accounts.length; i++) { // Khởi tạo giá trị cho i
        const username = accounts[i].split('|')[0];
        const password = accounts[i].split('|')[1];
        const code = accounts[i].split('|')[2];
        const ip = proxies[i].split(':')[0];
        const port = proxies[i].split(':')[1];
        const ipName = proxies[i].split(':')[2];
        const ipPassword = proxies[i].split(':')[3];
        response.push({
          username: username,
          password: password,
          code: code,
          port: port,
          ip: ip,
          ipName: ipName,
          ipPassword: ipPassword
        });
      }

      // for (const item of response) {
      //   await genCookies(item['username'], item['password'], item['code'], item['port'], item['ip'], item['ipName'], item['ipPassword']);
      // }
      await Promise.all(response.map(async (item) => {
        await genCookies(item['username'], item['password'], item['code'], item['port'], item['ip'], item['ipName'], item['ipPassword']);
      }));
    });
  });
}

run();
