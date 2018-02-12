import { smartNotifierHandler } from "hull/lib/utils";
import updateUser from "../lib/update-user";

const notify = smartNotifierHandler({
  handlers: {
    "user:update": updateUser
  }
});

export default notify;
