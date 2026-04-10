// Trustpilot Widget Bootstrap Script
(function(d, s, id) {
  var js, tjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) return;
  js = d.createElement(s); js.id = id;
  js.async = true;
  js.src = "//widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js";
  tjs.parentNode.insertBefore(js, tjs);
}(document, 'script', 'trustpilot-widget-script'));
