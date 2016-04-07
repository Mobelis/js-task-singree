var gulp = require('gulp'),
  plumber = require('gulp-plumber'),
  rename = require('gulp-rename');
var autoprefixer = require('gulp-autoprefixer');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var cleanCSS  = require('gulp-clean-css');
var sass = require('gulp-sass');
var mainBowerFiles = require('gulp-main-bower-files');
var order = require('gulp-order');
var filter = require('gulp-filter');

gulp.task('images', function() {
  gulp.src(['src/images/**/*.*'])
    .pipe(gulp.dest('public/images/'))
});

gulp.task('styles', function(){
  gulp.src(['src/css/**/*.sass'])
    .pipe(plumber({
      errorHandler: function (error) {
        console.log(error.message);
        this.emit('end');
      }}))
    .pipe(sass())
    .pipe(autoprefixer('last 2 versions'))
    .pipe(rename({suffix: '.min'}))
    .pipe(cleanCSS())
    .pipe(gulp.dest('public/css/'))
});

gulp.task('scripts', function(){
  return gulp.src('src/js/**/*.js')
    .pipe(plumber({
      errorHandler: function (error) {
        console.log(error.message);
        this.emit('end');
      }}))
    .pipe(concat('main.js'))
    .pipe(rename({suffix: '.min'}))
    .pipe(uglify())
    .pipe(gulp.dest('public/js/'))
});

gulp.task('main-bower-files-js', function() {
  var filterJS = filter('**/*.js', { restore: true });
  return gulp.src('./bower.json')
    .pipe(mainBowerFiles({
      overrides: {
        bootstrap: {
          main: [
            './dist/js/bootstrap.js',
          ]
        }
      }
    }))
    .pipe(filterJS)
    .pipe(concat('vendor.js'))
    .pipe(uglify())
    .pipe(gulp.dest('public/js'));
});

gulp.task('main-bower-files-font', function() {
  return gulp.src([
        'bower_components/bootstrap/fonts/*.{eot,svg,ttf,woff,woff2}'])
    .pipe(gulp.dest('public/fonts'));
});

gulp.task('main-bower-files-css', function() {
  var filterCss = filter('**/*.css', { restore: true });
  return gulp.src('./bower.json')
    .pipe(mainBowerFiles({
      overrides: {
        bootstrap: {
          main: [
            './dist/css/bootstrap.min.css'
          ]
        }
      }
    }))
    .pipe(filterCss)
    .pipe(concat('vendor.css'))
    .pipe(gulp.dest('public/css'));
});

// A development task to run anytime a file changes
gulp.task('watch', function() {
  gulp.watch("src/css/**/*.sass", ['styles']);
  gulp.watch("src/js/**/*.js", ['scripts']);
});

gulp.task('default', ['images','styles','scripts','main-bower-files-js','main-bower-files-css','main-bower-files-font']);