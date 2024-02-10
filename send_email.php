<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
  $name = $_POST['name'];
  $email = $_POST['email'];
  $subject = $_POST['subject'];
  $message = $_POST['message'];
  $to = 'ayandamzolo11@gmail.com';
  $headers = "From: $name <$email>";
  if (mail($to, $subject, $message, $headers)) {
    http_response_code(200);
    exit;
  } else {
    http_response_code(500);
    exit;
  }
}
?>
