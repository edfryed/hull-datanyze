/* global describe, it */
import { expect } from "chai";

import * as domainUtils from "../server/lib/domain-utils.js";

describe("domainUtils", () => {
  it("should expose normalize and verify functions", () => {
    expect(domainUtils).to.have.property("normalize")
      .that.is.a("function");
    expect(domainUtils).to.have.property("verify")
      .that.is.a("function");
  });

  it("should verify valid domains", () => {
    [
      "acme.com",
      "subdomain.acme.com",
      "multi.level.subdomain.acme.com",
      "speciał-chąracters.com",
      "x123y.com"
    ].map(input => {
      const result = domainUtils.verify(input);
      expect(result).to.be.true;
    });
  });

  it("should reject invalid domains", () => {
    [
      "__acme.com",
      "subdomain",
      "@!#$!@#",
      "val di sole"
    ].map(input => {
      const result = domainUtils.verify(input);
      expect(result).to.be.false;
    });
  });

  it("should get the domain part from url", () => {
    expect(domainUtils.normalize("http://www.domain.com/"))
      .to.be.eql("domain.com");
    expect(domainUtils.normalize("https://www.testing.com/some/path"))
      .to.be.eql("testing.com");
    expect(domainUtils.normalize("multi.level.subdomains.com/"))
      .to.be.eql("subdomains.com");
  });

  it("should get the domain from string with multiple uris", () => {
    expect(domainUtils.normalize("http://www.domain.com/,www.some.other.address.com"))
      .to.be.eql("domain.com");
    expect(domainUtils.normalize("www.domain.com, www.some.other.address.com"))
      .to.be.eql("domain.com");
    expect(domainUtils.normalize("das-test1.de; das-test4.de; das-test2.de"))
      .to.be.eql("das-test1.de");
  });
});
