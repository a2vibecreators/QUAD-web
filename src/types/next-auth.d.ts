import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      companyId: string
      role: string
      fullName: string
      domainId?: string
      domainRole?: string
      allocationPercentage?: number
    } & DefaultSession["user"]
    accessToken?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string
    companyId?: string
    role?: string
    fullName?: string
    domainId?: string
    domainRole?: string
    allocationPercentage?: number
    accessToken?: string
  }
}
