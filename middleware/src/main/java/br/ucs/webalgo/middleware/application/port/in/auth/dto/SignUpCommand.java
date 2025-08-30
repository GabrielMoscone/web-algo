package br.ucs.webalgo.middleware.application.port.in.auth.dto;

public record SignUpCommand(String firstName, String secondName, String username, String password, String email,
                            String obs, String city, String state, String gender) {
}
