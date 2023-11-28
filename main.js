const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const delay = require('./delay')
const base_url = "https://mbasic.facebook.com"

function getCookies(path) {
  return new Promise((resolve, reject) => {
      fs.readFile(path, 'utf8', (err, data) => {
          if (err) {
              console.error('There was an error reading the file:', err);
              reject(err);
              return;
          }
          resolve(JSON.parse(data));
      });
  });
}

async function createPost(page, content) {
  
  await page.waitForSelector('textarea[name="xc_message"]')
  await page.type('textarea[name="xc_message"]', content);
  await delay(4,8)

  await page.waitForSelector('input[name="view_post"]')
  await page.click('input[name="view_post"]')
  await delay(4,8)
}

async function interact(path, linkGroup) {
  const username = path.split('|')[0]
  const password = path.split('|')[1]
  const ip = path.split('|')[2]
  const port = path.split('|')[3]
  const ipName = path.split('|')[4]
  const ipPassword = path.split('|')[5]
  const browser = await puppeteer.launch({
    headless: false,
    args: [ `--proxy-server=http://${ip}:${port}` ]
  });
  const page = await browser.newPage();
  await page.authenticate({username: ipName, password: ipPassword});
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36');
  await page.setViewport({
    width: 1200,
    height: 800
  });
  const cookies = await getCookies(`cookies/${path}.json`)
  await page.setCookie(...cookies);
  await delay(3,4)
  await page.goto('https://whoer.net/')
  await delay(3,4)
  await page.goto("https://mbasic.facebook.com");
  await delay(3,4)
  console.log('----------------------------------------------------------------------------------------------------------------------------')
  try {
    await page.goto(linkGroup)
    await delay(3,4)
    await page.waitForSelector('input[name="pass"]', { timeout: 4000 });
    await page.type('input[name="pass"]', password);
    await delay(4, 8);
    await page.keyboard.press('Enter');
    await delay(4,8)
  } catch (error) {
    console.log("| Join nhóm này không cần password")
  }
  console.log('| Bắt đầu user: ',username)
  try {
    const joinGroup = await page.$('input[value="Tham gia nhóm"][type="submit"]');
    if (joinGroup) {
      await delay(2,3)
      await joinGroup.click();
      await delay(4,8)
      console.log(`| Tham gia nhóm ${linkGroup} thành công`)
    } else {
      console.log(`| Nhóm ${linkGroup} đã tham gia từ trước`);
    }
  } catch (error) {
    console.log("Lỗi khi tham gia nhóm")
  }

  const links = await page.$$eval('a.ee', anchors => {
    return anchors.map(anchor => anchor.getAttribute('href'));
  });
  const uniqueIds = new Set();
  const uniqueLinksArray = links.filter(link => {
    const idStartIndex = link.indexOf('permalink/') + 'permalink/'.length;
    const idEndIndex = link.indexOf('/?refid=');
    const currentId = link.slice(idStartIndex, idEndIndex);
    if (!uniqueIds.has(currentId)) {
      uniqueIds.add(currentId);
      return true;
    }
    return false;
  });
  for(let link of uniqueLinksArray) {
    console.log("| +++++++++++++++++++++++++++++++++++++++++++++++++++++++")
    console.log("| + Xử lý bài viết: ", link.split('permalink/')[1].split('/?refid')[0])
    await page.goto(link, { waitUntil: 'domcontentloaded' })
    try {
      const tableSelector = 'table[role="presentation"][align="start"]';
      await page.waitForSelector(tableSelector);
      const allAnchorElements = await page.$$eval(`${tableSelector} a`, anchors => {
        return anchors.map(anchor => {
            return {
              href: anchor.getAttribute('href'),
              textContent: anchor.textContent.trim(),
              attributes: Array.from(anchor.attributes).reduce((attrs, attr) => {
                attrs[attr.name] = attr.value;
                return attrs;
              }, {}),
            };
        });
      });
      let listAction = []
      allAnchorElements.forEach((item)=> {
        if (item['textContent'] === "Bày tỏ cảm xúc") {
          listAction.push(item)
        }
        if (item['textContent'] === "Bình luận") {
          listAction.push(item)
        }
      })
      if (listAction?.length > 1) {
        // Like
        for (item of listAction) {
          try {
            if (item['textContent'] === "Bày tỏ cảm xúc") {
              await delay(2,3)
              await page.goto(base_url+item['href'])
              await delay(2,3)
              const allAnchorElements = await page.$$eval('a', anchors => {
                return anchors.map(anchor => {
                  if (anchor.textContent.trim() === "Buồn" || anchor.textContent.trim() === "Phẫn nộ") {
                    return null
                  }
                  return {
                    href: anchor.getAttribute('href'),
                    textContent: anchor.textContent.trim(),
                  };
                });
              });
              const filteredAnchors = allAnchorElements.filter(anchor => anchor !== null);
              const anchorWithReactionHref = filteredAnchors.filter(anchor => anchor.href.includes('/ufi/reaction'));
              if (anchorWithReactionHref.length > 0) {
                const randomIndex = Math.floor(Math.random() * anchorWithReactionHref.length);
                const randomAnchor = anchorWithReactionHref[randomIndex];
                console.log('| + Random Action:', randomAnchor['textContent']);
                await delay(2,3)
                await page.goto(base_url+randomAnchor['href'])
                await delay(2,3)
              }
              continue
            }
            // Comment
            const list_comment = ["ib", "còn không ạ", "tốt lắm ạ"]
            const randomIndex = Math.floor(Math.random() * list_comment.length);
            const randomComment = list_comment[randomIndex];
            console.log("| + Bắt đầu bình luận ...")
            await delay(2,3)
            await page.goto(base_url+item['href'])
            await delay(2,3)
            await page.waitForSelector('textarea[name="comment_text"]');
            await page.type('textarea[name="comment_text"]', randomComment);
            await delay(2,3)
            await page.waitForSelector('input[name="post"]')
            await page.click('input[name="post"]')
            await delay(2,3)
          } catch (error) {
            console.log("| + Lỗi khi reaction")
          }
        }
        console.log("| + Hoàn thành")
        continue
      }
      console.log("| + Bài viết này đã được tương tác !!!")
      await delay(4,8)
    } catch (error) {
      console.log("Lỗi: ",error)
    }
  }
  console.log('----------------------------------------------------------------------------------------------------------------------------')
  await browser.close()
}

async function runAndProcess() {
  const folderPath = 'cookies';
  const groups = ['766939367338274']
  
    const files = fs.readdirSync(folderPath)
    while (true) {
      try {
        for (let groupId of groups) {
          link = `${base_url}/groups/${groupId}/?ref=share_group_link`
          for(let file of files) {
            const path = file.replace('.json','')
            await interact(path, link)
          }
        }
      } catch (err) {
        console.error('Lỗi khi đọc thư mục:', err);
      }
    }
  
}


runAndProcess()
