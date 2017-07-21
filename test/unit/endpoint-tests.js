/* global describe, it */
const assert = require("assert");

import cheerio from "cheerio";
import express from "express";
import Hull from "hull";
import { Cache } from "hull/lib/infra";
import request from "request";
import nock from "nock";
import Server from "../../server/server";
import ClientMock from "./support/client-mock";

const port = 8070;
const app = express();
const cache = new Cache({
  store: "memory",
  ttl: 1
});

const connector = new Hull.Connector({ port, cache, hostSecret: "123" });
const options = { connector };

connector.setupApp(app);

app.use((req, res, next) => {
  req.hull.client = ClientMock();

  req.hull.ship = { // mocks
    private_settings: {
      username: "email@email.com",
      token: "12345"
    }
  };

  next();
});

connector.startApp(Server(app, options));

const datanyzeMock =
  nock("http://api.datanyze.com")
    .get("/limits/")
    .query(true)
    .reply(200, {
      api_hourly: "10",
      api_hourly_limit: "100",
      api_daily: "100",
      api_daily_limit: "1000",
      api_monthly: "1000",
      api_monthly_limit: "10000"
    });


describe("Server", () => {
  describe("for /admin", () => {
    it("should connect with datanyze's API and return status OK with admin.html rendered file", (done) => {
      let body = "";
      request
        .get(`http://127.0.0.1:${port}/admin`)
        .on("response", (response) => {
          assert(response.statusCode === 200);
          datanyzeMock.done();
        })
        .on("data", (data) => {
          body += data;
        });

      // Parse rendered html to be 100% certain that returned values are correct
      let limit = 10;
      setTimeout(() => {
        const $ = cheerio.load(body);
        $(".progress-bar").children().each((index, elem) => {
          if (elem.name === "strong") {
            assert.equal($(elem).text(), `${limit} / ${limit * 10}`);
            limit *= 10;
          }
        });

        done();
      }, 100);
    });
  });
});
