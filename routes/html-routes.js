const mysql = require("mysql");
const bodyParser = require("body-parser");
const cors = require("cors");
const corsOptions = {
  methods: ["POST"],
  allowedHeaders: ["Content-Type", "application/json"],
};

module.exports = function (app, connection, transporter) {
  app.get("/filterNames", cors(), function (req, res) {
    connection.query(
      mysql.format(`SELECT id, chineseName FROM chineseNameTranslation WHERE chineseName LIKE '%(%)%';`),
      function (error, data) {
        if (error) {
          console.log(`ERROR: ${error}`);
        } else {
          const databaseSize = data.length;
          const surname = /(用于名字第一节)/g;
          const femRegex = /(女)/g;
          const expRegex = /\(柯尔克孜·汉语拼音\)/g;

          for (let i = 0; i < databaseSize; i++) {
            const input = data[i].chineseName;
            const items = input.split(";");
            let output = '';

            if (input.search(surname) > 0) {
              for (let j = 0; j < items.length; j++) {
                if (items[j].search(surname) > 0) {
                  items[j] = items[j].replace(surname, "surname");
                } else {
                  items[j] += "(given name)";
                }
              }
            }

            if (input.search(femRegex) > 0) {
              for (let j = 0; j < items.length; j++) {
                if (items[j].search(femRegex) > 0) {
                  items[j] = items[j].replace(femRegex, "female");
                } else {
                  items[j] += "(male)";
                }
              }
            }

            for (let j = 0; j < items.length; j++) {
              output += items[j];
              if (items.length - 1 !== j) {
                output += ";";
              }
            }

            if (output.search(expRegex) > 0) {
              output = output.replace(expRegex, '');
            }

            console.log(`Number: ${i}\nID: ${data[i].id}\nOld Name: ${data[i].chineseName}\nNew Name: ${output}`);
            connection.query(
              mysql.format(`UPDATE chineseNameTranslation SET chineseName = ? WHERE id = ?;`, [output, data[i].id]),
              function (error, data) {
                if (error) {
                  console.log(`ERROR: ${error}`);
                } else {
                  // console.log(`RESULT: ${data[0]}`)
                }
              }
            );
          }

          // for (let i = 0; i < databaseSize; i++) {
          //   connection.query(
          //     mysql.format(
          //       `SELECT chineseName FROM chineseNameTranslation WHERE id = ?;`,
          //       i
          //     ),
          //     function (error, data) {
          //       if (error) {
          //         console.log(`ERROR: ${error}`);
          //       } else {
          //         if (data.length) {
          //           const input = data[0].chineseName;
          //           const items = input.split(";");
          //           const femRegex = /(女名)/g;
          //           const expRegex = /\(.*昵称.*\)|\(.*教名.*\)|\(.*伊斯兰教.*\)|\(.*国王.*\)|\(.*宗教.*\)|\(.*尊称.*\)|\(.*参见.*\)|\(.*发明家.*\)|\(.*天文学家.*\)|\(.*创始人.*\)|\(.*宗教.*\)|\(.*权威.*\)|\(.*人物.*\)|\(.*广东话.*\)|\(.*藏语.*\)|\(.*普通话.*\)/g;
          //           let output = "";
          //
          //           if (input.search(expRegex) > 0) {
          //             for (let j = 0; j < items.length; j++) {
          //               if (items[j].search(expRegex) > 0) {
          //                 items[j] = items[j].replace(expRegex, "");
          //               }
          //             }
          //
          //             // console.log(`old chineseName[${i}] = ${input}`)
          //             // console.log(`new chineseName[${i}] = ${output}\n`);
          //           }
          //
          //           if (input.search(femRegex) > 0) {
          //             for (let j = 0; j < items.length; j++) {
          //               if (items[j].search(femRegex) > 0) {
          //                 items[j] = items[j].replace(femRegex, "female");
          //               } else {
          //                 items[j] += "(male)";
          //               }
          //             }
          //             // console.log(`old chineseName[${i}] = ${input}`)
          //             // console.log(`new chineseName[${i}] = ${output}\n`);
          //           }
          //           for (let j = 0; j < items.length; j++) {
          //             output += items[j];
          //             if (items.length - 1 !== j) {
          //               output += ";";
          //             }
          //           }
          //           console.log(`old chineseName[${i}] = ${input}`);
          //           console.log(`new chineseName[${i}] = ${output}\n`);
          //           connection.query(
          //             mysql.format(`UPDATE chineseNameTranslation SET chineseName = ? WHERE id = ?;`, [output, i]),
          //             function (error, data) {
          //               if (error) {
          //                 console.log(`ERROR: ${error}`);
          //               } else {
          //                 console.log(`RESULT: ${data[0]}`)
          //               }
          //             }
          //           );
          //         }
          //       }
          //     }
          //   );
          // }
          console.log("DONE!");
        }
      }
    );
  });
  app.get("/getName", cors(), function (req, res) {
    const name = req.query.name;

    connection.query(
      mysql.format(
        `SELECT chineseName FROM chineseNameTranslation WHERE westernName = ?;`,
        name
      ),
      function (error, data) {
        console.log(error ? error : data);
        error ? res.send(error) : res.json({ names: data });
      }
    );
  });

  app.get("/getRandomName", cors(), function (req, res) {
    console.log("connected, gender:", req.query.gender);
    const gender = req.query.gender;

    connection.query(
      mysql.format(
        "SELECT given_name FROM authenticChineseNames WHERE gender = ? ORDER BY RAND() LIMIT 1",
        gender
      ),
      function (error, data) {
        console.log(error ? error : data);
        error ? res.send(error) : res.json({ chineseName: data });
      }
    );
  });

  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

  app.options("/sendMail", cors(corsOptions));
  app.post("/sendMail", cors(corsOptions), function (req, res) {
    console.log("Got body:", req.body);
    const data = req.body;
    const mail = {
      from: "chinese.name.generator.2020@gmail.com",
      to: "xuansu1012@gmail.com",
      subject: "New Request",
      text: "description: " + data.description + " email: " + data.email,
    };
    res.sendStatus(200);

    transporter.sendMail(mail, (error, info) => {
      error ? res.send(error) : res.send(info.response);
    });
  });
};
