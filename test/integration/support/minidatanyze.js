import Minihull from "minihull/src/mini-hull";

export default class Minidatanyze extends Minihull {
  constructor(options = {}) {
    super(options);
    this.app.get("/limits", (req, res) => {
      res.json({});
    });
  }
}
