/* global describe, it */
import assert from "assert";
import { Cache } from "hull/lib/infra";
import nock from "nock";
import ClientMock from "./support/client-mock";
import Datanyze from "../../server/lib/datanyze";
import sinon from "sinon";


const cache = new Cache({
  store: "memory",
  ttl: 1
});

cache.wrap = (key, callback) => Promise.resolve(callback());

const datanyzeLimitsNock = () =>
  nock("http://api.datanyze.com")
    .get("/limits/")
    .reply(200, {
      api_hourly: "10000000000",
      api_hourly_limit: "100000000000",
      api_daily: "10000000",
      api_daily_limit: "1000000",
      api_monthly: "10",
      api_monthly_limit: "100"
    });


describe("Datanyze Client", () => {
  const client = new ClientMock();
  const datanyzeClient = new Datanyze({ cache, logger: client.logger });

  it("for getDomainInfo function", () => {
    it("should catch error about rate limits", (done) => {
      const loggerSpy = sinon.spy(client.logger, "debug");

      datanyzeClient.getDomainInfo("test.com").then(() => {
        datanyzeLimitsNock().done();
        assert(loggerSpy.calledTwice);
        assert(loggerSpy.firstCall.args[0].match("datanyze.request"));
        assert(loggerSpy.firstCall.args[1].path.match("limits"));
        assert(loggerSpy.secondCall.args[0].match("datanyze.request.error"));
        assert(loggerSpy.secondCall.args[1].errors.message.match("RateLimitError"));
        done();
      });
    });
  });

  it("for addDomain function", () => {
    it("should catch error about rate limits", (done) => {
      const loggerSpy = sinon.spy(client.logger, "debug");

      datanyzeClient.addDomain("test.com").then(() => {
        datanyzeLimitsNock().done();
        assert(loggerSpy.calledTwice);
        assert(loggerSpy.firstCall.args[0].match("datanyze.request"));
        assert(loggerSpy.firstCall.args[1].path.match("limits"));
        assert(loggerSpy.secondCall.args[0].match("datanyze.request.error"));
        assert(loggerSpy.secondCall.args[1].errors.message.match("RateLimitError"));
        done();
      });
    });
  });
});

