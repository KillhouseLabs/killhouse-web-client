import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "util";
import { ReadableStream } from "stream/web";

// Polyfill Web APIs for Next.js API routes in tests
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
global.ReadableStream = ReadableStream;

// Simple Request/Response polyfill for tests
if (typeof global.Request === "undefined") {
  global.Request = class Request {
    constructor(url, init = {}) {
      this.url = url;
      this.method = init.method || "GET";
      this.headers = new Map(Object.entries(init.headers || {}));
      this._bodyInit = init.body;
    }

    async json() {
      return JSON.parse(this._bodyInit);
    }

    async text() {
      return this._bodyInit;
    }
  };
}

if (typeof global.Headers === "undefined") {
  global.Headers = class Headers extends Map {
    get(name) {
      return super.get(name.toLowerCase());
    }
    set(name, value) {
      return super.set(name.toLowerCase(), value);
    }
  };
}

if (typeof global.Response === "undefined") {
  global.Response = class Response {
    constructor(body, init = {}) {
      this.body = body;
      this.status = init.status || 200;
      this.statusText = init.statusText || "";
      this.headers = new global.Headers(init.headers || {});
      this.ok = this.status >= 200 && this.status < 300;
    }

    async json() {
      return JSON.parse(this.body);
    }

    async text() {
      return this.body;
    }

    static json(data, init = {}) {
      return new Response(JSON.stringify(data), {
        ...init,
        headers: {
          "content-type": "application/json",
          ...init.headers,
        },
      });
    }
  };
}

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn().mockReturnValue(null),
  }),
  usePathname: () => "/",
}));

// Mock next-auth/react
jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
  signOut: jest.fn(),
  useSession: jest.fn(() => ({
    data: null,
    status: "unauthenticated",
  })),
}));

// Suppress console errors in tests (optional)
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("Warning: ReactDOM.render")
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
