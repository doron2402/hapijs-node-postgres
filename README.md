# hapijs-node-postgres
hapi-node-postgres-7

## Install the plugin
`npm install --save hapi-node-postgres-7`

## Use native mode
 if you would like to use the `native` mode you'll have to manually `npm install pg-native`
 I use the pure Javascript driver it's protable and pretty fast.

## Register the plugin
```javascript
  server.register({
      register: Hapi_PG,
      options: {
          connectionString: 'postgres://user:password@localhost:5432/my_app' //optional
      }
  }, (err) => {

      if (err) {
          throw err;
      }

      console.log('Server is running');
  });



```

## Use Postgres via the `request` object
```javascript

handler: function (request, reply) {
    request.pg.client.query(`select * from users where user_id = ${request.params.id}`)
    .then((res) => {
      if (res.rows && res.rows.length > 0) {
          return reply({ result: res.rows }).code(200);
      } else {
          return reply('Not Found').code(404);
      }
    })
    .catch((err) => {
      return reply({ error: err }).code(500);
    });
}
```

## Use Postgres via the `server` object
```javascript
    var { pool } = server.plugins['hapijs-node-postgres-7'];
    pool.query(`select * from users limit 10`)
    .then((result) => {
        // print the results from the table
        console.log(result.rows);
    })
    .catch(e => { throw e });
```

## Example
  - Checkout [this](example/example.js)

## Bugs & PR's
  - PR's are welcome just follow the coding style

