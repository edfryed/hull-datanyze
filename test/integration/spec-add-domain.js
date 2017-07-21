/* global describe, it, before, after */

import Minihull from "minihull";
import { expect } from "chai";

import Minidatanyze from "./support/minidatanyze";
import bootstrap from "./support/bootstrap";

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
    minihull.listen(8001).then(done);
    minidatanyze.listen(8002);
    minihull.stubConnector({
      id: "123456789012345678901234",
      private_settings: {
        token: "datanyzeABC",
        username: "datanyzeDEF",
        synchronized_segments: ["A"],
        target_trait: "domain"
      }
    });
  });

  it("should try to add new domain 2 times", (done) => {
    minidatanyze.stubApp("/domain_info")
      .respond({
        error: 103
      });

    minidatanyze.stubApp("/add_domain")
      .respond("ok");

    minihull.notifyConnector("123456789012345678901234", "http://localhost:8000/notify", "user_report:update", {
      user: { email: "foo@bar.com", domain: "foo.bar" },
      changes: [],
      events: [],
      segments: [{ id: "A" }]
    }).then(() => {});

    minidatanyze.on("incoming.request#4", (req) => {
      expect(req.url).to.be.eql("/add_domain/?token=datanyzeABC&email=datanyzeDEF&domain=foo.bar");
      done();
    });
  });

  after(() => {
    minihull.close();
    minidatanyze.close();
    server.close();
  });
});
