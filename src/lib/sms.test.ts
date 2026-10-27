import assert from "node:assert/strict";
import { test } from "node:test";

import { classifyInbound, validTwilioSignature } from "./sms";

test("classifies carrier keywords", () => {
  assert.equal(classifyInbound(" stop "), "STOP");
  assert.equal(classifyInbound("Unsubscribe"), "STOP");
  assert.equal(classifyInbound("YES!"), "YES");
  assert.equal(classifyInbound("start"), "START");
  assert.equal(classifyInbound("help"), "HELP");
  assert.equal(classifyInbound("Do you have the chainsaw?"), "OTHER");
});

test("validates a Twilio signature the documented way", () => {
  process.env.TWILIO_AUTH_TOKEN = "12345";
  // Example from Twilio's security docs.
  const url = "https://mycompany.com/myapp.php?foo=1&bar=2";
  const params = { CallSid: "CA1234567890ABCDE", Caller: "+12349013030", Digits: "1234", From: "+12349013030", To: "+18005551212" };
  assert.equal(validTwilioSignature(url, params, "0/KCTR6DLpKmkAf8muzZqo1nDgQ="), true);
  assert.equal(validTwilioSignature(url, params, "nope"), false);
  assert.equal(validTwilioSignature(url, params, null), false);
});
