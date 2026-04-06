/**
 * Inngest client singleton. Used by function definitions and the serve handler.
 */

import { Inngest } from "inngest";

export const inngest = new Inngest({ id: "devdocs-ai" });
