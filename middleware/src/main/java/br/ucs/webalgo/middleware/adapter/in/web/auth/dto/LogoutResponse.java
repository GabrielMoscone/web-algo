package br.ucs.webalgo.middleware.adapter.in.web.auth.dto;

public class LogoutResponse {

    private String username;

    public LogoutResponse(String username) {
        this.username = username;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }
}
