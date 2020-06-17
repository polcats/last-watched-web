function Login(event) {
    event.preventDefault();
    $("button#login_button").attr("disabled", true);

    $("#login-help")
        .removeClass("is-danger")
        .html("");

    let data = $("#login").serialize();
    $.post("/login", data)
        .fail(function() {
            $("#login-help")
                .addClass("is-danger")
                .html("Incorrect username or password.");
        })
        .done(function() {
            window.location.replace("/");
        })
        .always(function() {
            $("button#login_button").attr("disabled", false);
        });
}
