/* global describe, it, before, after */

import Minihull from "minihull";
import { expect } from "chai";
import nock from "nock";

import Minidatanyze from "./minidatanyze";
import bootstrap from "./bootstrap";

process.env.OVERRIDE_DATANYZE_URL = "http://localhost:8002";
process.env.ADD_DOMAIN_DELAY = 1;

describe("add domain operation", function test() {
  let minihull;
  let minidatanyze;
  let server;
  before((done) => {
    minihull = new Minihull();
    minidatanyze = new Minidatanyze();
    server = bootstrap();
    setTimeout(() => {
      minihull.listen(8001);
      minihull.install("http://localhost:8000")
        .then(() => {
          minihull.updateFirstShip({
            token: "datanyzeABC",
            username: "datanyzeDEF",
            synchronized_segments: ["A"],
            target_trait: "domain"
          });
          done();
        });
    }, 100);

    minidatanyze.listen(8002);
  });

  it("should try to add new domain 2 times", (done) => {
    minidatanyze.app.get("/domain_info", (req, res) => {
      res.json({
        error: 103
      });
    });

    minidatanyze.app.get("/add_domain", (req, res) => {
      res.end("ok");
    });

    minihull.sendNotification("user_report:update", {
      user: { email: "foo@bar.com", domain: "foo.bar" },
      changes: [],
      events: [],
      segments: [{ id: "A" }]
    });

    minidatanyze.on("incoming.request.4", (req) => {
      expect(req.url).to.be.eql("/add_domain/?token=datanyzeABC&email=datanyzeDEF&domain=foo.bar");
      done();
    });
  });


  it.only("should update user", (done) => {
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

    minihull.sendNotification("user_report:update", {
      user: { email: "foo@bar.com", domain: "foo.bar" },
      changes: [],
      events: [],
      segments: [{ id: "A" }]
    });

    minihull.on("incoming.request", (req) => {
      console.log(req);
      if (req._parsedUrl.path === "/api/v1/firehose") {
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
