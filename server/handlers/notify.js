import { notifHandler } from "hull/lib/utils";
import updateUser from "../lib/update-user";

const notify = notifHandler({
  handlers: {
    "user:update": updateUser
  }
});

export default notify;
