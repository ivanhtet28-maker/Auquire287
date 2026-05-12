/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ViktorSpacesEmail from "../ViktorSpacesEmail.js";
import type * as activityFeed from "../activityFeed.js";
import type * as agentRuns from "../agentRuns.js";
import type * as agents_briefer from "../agents/briefer.js";
import type * as agents_closer from "../agents/closer.js";
import type * as agents_hunter from "../agents/hunter.js";
import type * as agents_lister from "../agents/lister.js";
import type * as agents_responder from "../agents/responder.js";
import type * as agents_scout from "../agents/scout.js";
import type * as auth from "../auth.js";
import type * as briefs from "../briefs.js";
import type * as buyBoxes from "../buyBoxes.js";
import type * as chat from "../chat.js";
import type * as constants from "../constants.js";
import type * as conversationMessages from "../conversationMessages.js";
import type * as conversations from "../conversations.js";
import type * as demoLeads from "../demoLeads.js";
import type * as enquiries from "../enquiries.js";
import type * as http from "../http.js";
import type * as inventoryAudits from "../inventoryAudits.js";
import type * as listings from "../listings.js";
import type * as marketSnapshots from "../marketSnapshots.js";
import type * as seedTestUser from "../seedTestUser.js";
import type * as testAuth from "../testAuth.js";
import type * as users from "../users.js";
import type * as viktorTools from "../viktorTools.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ViktorSpacesEmail: typeof ViktorSpacesEmail;
  activityFeed: typeof activityFeed;
  agentRuns: typeof agentRuns;
  "agents/briefer": typeof agents_briefer;
  "agents/closer": typeof agents_closer;
  "agents/hunter": typeof agents_hunter;
  "agents/lister": typeof agents_lister;
  "agents/responder": typeof agents_responder;
  "agents/scout": typeof agents_scout;
  auth: typeof auth;
  briefs: typeof briefs;
  buyBoxes: typeof buyBoxes;
  chat: typeof chat;
  constants: typeof constants;
  conversationMessages: typeof conversationMessages;
  conversations: typeof conversations;
  demoLeads: typeof demoLeads;
  enquiries: typeof enquiries;
  http: typeof http;
  inventoryAudits: typeof inventoryAudits;
  listings: typeof listings;
  marketSnapshots: typeof marketSnapshots;
  seedTestUser: typeof seedTestUser;
  testAuth: typeof testAuth;
  users: typeof users;
  viktorTools: typeof viktorTools;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
