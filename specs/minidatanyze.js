import Minibase from "minihull/src/minibase";

export default class Minidatanyze extends Minibase {
  constructor(options = {}) {
    super(options);
    this.app.get("/limits", (req, res) => {
      res.json({});
    });
  }
}
