package br.ucs.webalgo.middleware.adapter.in.web.auth.dto;

public class LoginResponse {

    private String username;

    public LoginResponse() {
    }

    public LoginResponse(String username) {
        this.username = username;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }
}
