import URI from "urijs";

/**
 * @param  {String} domain
 * @return {String}
 */
export function normalize(domain) {
  let result;
  let normalizedDomain;

  try {
    result = URI.withinString(domain, (u) => u);
    normalizedDomain = URI(result)
      .normalizeProtocol()
      .hostname();
  } catch (e) {} // eslint-disable-line no-empty

  if (!normalizedDomain) {
    normalizedDomain = domain;
  }

  return normalizedDomain;
}


/**
 * @param  {String} domain
 * @return {Boolean}
 */
export function verify(domain) {
  return /\b((?=[a-z0-9-]{1,63}\.)(xn--)?[a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,63}\b/.test(domain);
}
