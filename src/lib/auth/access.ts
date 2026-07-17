import { defaultAc } from "better-auth/plugins/admin/access";

export const adminRole = defaultAc.newRole({
  user: ["list"],
  session: [],
});

export const userRole = defaultAc.newRole({
  user: [],
  session: [],
});
