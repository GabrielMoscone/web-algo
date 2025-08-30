package br.ucs.webalgo.middleware.adapter.in.web.auth.dto;

public class SignUpResponse {

    private String message;

    public SignUpResponse(String message) {
        this.message = message;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
