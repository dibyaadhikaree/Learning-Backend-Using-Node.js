module.exports = class {
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
  }
  filter() {
    // /api/b1/tours?duration[gte]=5, difficulty=easy , sort=ratings,page=5

    //here difficulty=easy and duration greater than 5 are filters ,rest of them are different features available to us

    let filter = { ...this.queryStr };

    //filter = {
    // duration: { gte: '5' },
    // difficulty: 'easy'  ,
    // sort : 'ratings'
    // }   : this is what we get

    //Removing not required fields from the query string
    const excludedFields = ["page", "sort", "limit", "fields"];

    excludedFields.forEach((el) => {
      delete filter[el];
    });

    //ADVANCED FILTERING
    //{difficulty : 'easy', duration : {$lt: 5}}  : required

    //creating filter expressions using regex
    filter = JSON.stringify(filter);
    filter = filter.replace(/\b(gte|gt|lte|lt)\b/g, (arg) => `$${arg}`);

    this.query = this.query.find(JSON.parse(filter));
    //this returns a data into query (promise) which we have to await
    //we can run another query over this query so that all the querys can be added with other methods

    return this;
  }

  sort() {
    if (this.queryStr.sort) {
      const sortBy = this.queryStr.sort.split(",").join(" ");
      this.query = this.query.sort(sortBy);
      //sort('price ratingsAverage')
    } else this.query = this.query.sort("-createdAt");
    return this;
  }

  limitFields() {
    if (this.queryStr.fields) {
      const fields = this.queryStr.fields.split(",").join(" ");
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select("-__v");
    }
    return this;
  }

  paginate() {
    const page = this.queryStr.page * 1 || 1;
    const limit = this.queryStr.limit * 1 || 100;

    const skip = (page - 1) * limit;
    //page=2&limit=10 i.e 1-10 = p1 , 11-20=p2 ...
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
};

//BUILD THE QUERY
// let filter = { ...req.query };

// const excludedFields = ["page", "sort", "limit", "fields"];

// excludedFields.forEach((el) => {
//   delete filter[el];
// });

// //ADVANCED FILTERING
// //{difficulty : 'easy', duration : {$lt: 5}}
// // { duration: { gte: '5' }, difficulty: 'easy' }
// const filterStr = JSON.stringify(filter);
// filter = filterStr.replace(/\b(gte|gt|lte|lt)\b/g, (arg) => `$${arg}`);

// let query = Tour.find(JSON.parse(filter));

//SORTING
// if (req.query.sort) {
//   const sortBy = req.query.sort.split(",").join(" ");
//   query = query.sort(sortBy);
//   //sort('price ratingsAverage')
// } else query = query.sort("-createdAt");

// // FIELD LIMITING
// if (req.query.fields) {
//   const fields = req.query.fields.split(",").join(" ");
//   query = query.select(fields);
// } else {
//   query = query.select("-__v");
// }

// //PAGINATION

// const page = req.query.page * 1 || 1;
// const limit = req.query.limit * 1 || 100;

// const skip = (page - 1) * limit;
// //page=2&limit=10 i.e 1-10 = p1 , 11-20=p2 ...
// query = query.skip(skip).limit(limit);

// if (req.query.page) {
//   const numTour = await Tour.countDocuments();
//   if (skip >= numTour) {
//     throw new Error("This page doesnt exist");
//   }
// }
