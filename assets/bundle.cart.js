window.REBASE = window.REBASE || {};
REBASE.theme = REBASE.theme || {};

(function($) {
  $(function() {
    REBASE.theme.appendToFilename = function(filename, str) {
      var dot_indx = filename.lastIndexOf('.');

      if (dot_indx === -1) {
        return filename + str;
      } else {
        return filename.substring(0, dot_indx) + str + filename.substring(dot_indx);
      }
    };
  });
})(jQuery);
