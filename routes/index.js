
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'There\'s No Box Image Gallery Demo' });
};
