// Copyright IBM Corp. 2015,2019. All Rights Reserved.
// Node module: loopback-connector-postgresql
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';
const should = require('should'),
  assert = require('assert');
let Post, db, Charge, Currency;

describe('filter undefined fields', function() {
  before(function() {
    db = global.getDataSource();

    Post = db.define('FilterUndefined', {
      defaultInt: {
        type: 'Number',
        postgresql: {
          dbDefault: '5',
        },
      },
      first: {
        type: 'String',
      },
      second: {
        type: 'Number',
      },
      third: {
        type: 'Number',
      },
    });
  });

  it('should run migration', function(done) {
    db.automigrate('FilterUndefined', function() {
      done();
    });
  });

  it('should insert only default value', function(done) {
    const dflPost = new Post();
    dflPost.save(function(err, p) {
      should.not.exist(err);
      Post.findOne({where: {id: p.id}}, function(err, p) {
        should.not.exist(err);
        p.defaultInt.should.be.equal(5);
        should.not.exist(p.first);
        should.not.exist(p.second);
        should.not.exist(p.third);
      });
      done();
    });
  });

  it('should insert default value and \'third\' field', function(done) {
    const dflPost = new Post();
    dflPost.third = 3;
    dflPost.save(function(err, p) {
      should.not.exist(err);
      Post.findOne({where: {id: p.id}}, function(err, p) {
        should.not.exist(err);
        p.defaultInt.should.be.equal(5);
        should.not.exist(p.first);
        should.not.exist(p.second);
        should.exist(p.third);
        p.third.should.be.equal(3);
      });
      done();
    });
  });

  it('should update \'first\' and \'third\' fields of record with id==2 to predefined values', function(done) {
    Post.findOne({where: {id: 2}}, function(err, p) {
      should.not.exist(err);
      should.exist(p);
      p.id.should.be.equal(2);
      p.updateAttributes({first: 'one', third: 4}, function(err, p) {
        Post.findOne({where: {id: 2}}, function(err, p) {
          should.not.exist(err);
          p.defaultInt.should.be.equal(5);
          p.first.should.be.equal('one');
          should.not.exist(p.second);
          p.third.should.be.equal(4);
          done();
        });
      });
    });
  });

  it('should update \'third\' field of record with id==2 to null value', function(done) {
    Post.findOne({where: {id: 2}}, function(err, p) {
      should.not.exist(err);
      should.exist(p);
      p.id.should.be.equal(2);
      p.updateAttributes({first: 'null in third', third: null}, function(err, p) {
        Post.findOne({where: {id: 2}}, function(err, p) {
          should.not.exist(err);
          p.defaultInt.should.be.equal(5);
          p.first.should.be.equal('null in third');
          should.not.exist(p.second);
          should.not.exist(p.third);
          done();
        });
      });
    });
  });

  it('should insert a value into \'defaultInt\' and \'second\'', function(done) {
    const dflPost = new Post();
    dflPost.second = 2;
    dflPost.defaultInt = 11;
    dflPost.save(function(err, p) {
      should.not.exist(err);
      Post.findOne({where: {id: p.id}}, function(err, p) {
        should.not.exist(err);
        p.defaultInt.should.be.equal(11);
        should.not.exist(p.first);
        should.not.exist(p.third);
        // should.exist(p.third);
        p.second.should.be.equal(2);
        done();
      });
    });
  });

  it('should create an object with a null value in \'first\'', function(done) {
    Post.create({first: null}, function(err, p) {
      should.not.exist(err);
      Post.findOne({where: {id: p.id}}, function(err, p) {
        should.not.exist(err);
        p.defaultInt.should.equal(5);
        should.not.exist(p.first);
        should.not.exist(p.second);
        should.not.exist(p.third);
        done();
      });
    });
  });

  describe('able to handle null foreign keys', function() {
    before(function(done) {
      Charge = db.define('Charge', {amount: Number});
      Currency = db.define('Currency', {code: String, country: String});
      Charge.belongsTo('Currency', {as: 'currency'});
      db.automigrate(['Charge', 'Currency'], done);
    });

    it('able to create entity with null foreign key', function(done) {
      Currency.create({code: 'USD', country: 'USA'}, function(err, currency) {
        if (err) return done(err);
        Charge.create({amount: 10, currencyId: currency.id}, function(err) {
          if (err) return done(err);
          Charge.create({amount: 10, currencyId: null}, function(err, charge) {
            if (err) return done(err);
            should.not.exist(charge.currencyId);
            done();
          });
        });
      });
    });

    it('able to query entities with null foreign key', function(done) {
      Charge.find({
        where: {currency: {
          inq: [null, 1],
        }},
        include: {relation: 'currency'},
      }, function(err, charges) {
        if (err) return done(err);
        charges.should.have.lengthOf(2);
        done();
      });
    });

    it('able to filter entities with null id condition', function(done) {
      Currency.find({
        where: {
          id: {
            inq: [null, 1],
          },
        },
      },
      function(err, currencies) {
        if (err) return done(err);
        currencies.should.have.lengthOf(1);
        done();
      });
    });
  });
});
