/* @flow */
import rest from "restler";
import { Request, Response } from "express";
export default function admin(req: Request, res: Response) {
  const { username, token } = req.hull.ship.private_settings;
  rest
    .get("http://api.datanyze.com/limits/", { query: { email: username, token } })
    .on("success", function onLimitSucces(limits = {}) {
      req.hull.client.logger.debug("datanyze.rate.debug", limits);
      res.render("admin.html", {
        limits,
        progress: {
          hourly: Math.ceil((limits.api_hourly / limits.api_hourly_limit) * 100),
          daily: Math.ceil((limits.api_daily / limits.api_daily_limit) * 100),
          monthly: Math.ceil((limits.api_monthly / limits.api_monthly_limit) * 100)
        },
        connected: (!!token && !!username && !!limits.api_monthly),
        name: "Datanyze"
      });
    });
}
