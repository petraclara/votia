import type { DefaultSession } from "next-auth";
import type { OrganizerStatus, Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: Role;
      organizerId: string | null;
      organizerStatus: OrganizerStatus | null;
    };
  }

  interface User {
    role: Role;
    organizerId: string | null;
    organizerStatus: OrganizerStatus | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    organizerId: string | null;
    organizerStatus: OrganizerStatus | null;
  }
}
