/* global describe, it, before, after */
import Minihull from "minihull";
import _ from "lodash";
import assert from "assert";

import Minidatanyze from "./minidatanyze";
import bootstrap from "./bootstrap";

process.env.OVERRIDE_DATANYZE_URL = "http://localhost:8002";
process.env.ADD_DOMAIN_DELAY = 1;


describe("update user operation", function test() {
  let minihull;
  let minidatanyze;
  let server;
  before((done) => {
    minihull = new Minihull();
    minidatanyze = new Minidatanyze();
    server = bootstrap();
    minihull.listen(8001).then(done);
    minihull.stubConnector({
      id: "123456789012345678901234",
      private_settings: {
        token: "datanyzeABC",
        username: "datanyzeDEF",
        synchronized_segments: ["B"],
        target_trait: "domain"
      }
    });
    minidatanyze.listen(8002);
  });

  it("should update user", (done) => {
    minidatanyze.app.get("/domain_info", (req, res) => {
      res.json({
        technologies: [
          {
            name: "scala",
          }, {
            name: "react",
          }
        ]
      });
    });

    minidatanyze.app.get("/add_domain", (req, res) => {
      res.end("ok");
    });

    minihull.notifyConnector("123456789012345678901234", "http://localhost:8000/notify", "user_report:update", {
      user: { email: "foo@bar.com", domain: "foo.bar" },
      changes: [],
      events: [],
      segments: [{ id: "B" }]
    }).then(() => {});

    minihull.on("incoming.request", (req) => {
      if (req.url === "/api/v1/firehose") {
        const data = req.body.batch[0];
        assert(data.type === "traits");
        assert.equal(_.get(data.body, "datanyze/technologies")[0], "scala");
        assert.equal(_.get(data.body, "datanyze/technologies")[1], "react");
        done();
      }
    });
  });

  after(() => {
    minihull.close();
    minidatanyze.close();
    server.close();
  });
});
