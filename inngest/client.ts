import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "hunch",
  eventKey: process.env.INNGEST_EVENT_KEY || "local",
});
