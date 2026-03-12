# isSuperAdmin - Super Simple Guide

## What it does

Like a magic key that gives someone super powers in our app.

## How it works

1. Someone sends a secret code in header `x-user-token`
2. We turn it from funny letters (base64) to normal text
3. If it matches our secret → they become **Super Admin**!
4. We save this info and continue

## The code

```javascript
const adminSecret = process.env.SUPER_ADMIN_SECRET;
const requestSecret = req.headers['x-user-token'];
const decodedSecret = Buffer.from(requestSecret, 'base64').toString('utf-8');

if (adminSecret && requestSecret && adminSecret === decodedSecret) {
  res.locals.user = {isSuperAdmin: true};
}
next();
```

## That's it!

Match secrets → Super Admin → move on!
