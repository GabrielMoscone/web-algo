package br.ucs.webalgo.middleware.adapter.in.web.auth;

import br.ucs.webalgo.middleware.adapter.in.web.auth.dto.*;
import br.ucs.webalgo.middleware.adapter.in.web.auth.mapper.ChangePasswordMapper;
import br.ucs.webalgo.middleware.adapter.in.web.auth.mapper.LoginMapper;
import br.ucs.webalgo.middleware.adapter.in.web.auth.mapper.LogoutMapper;
import br.ucs.webalgo.middleware.adapter.in.web.auth.mapper.SignUpMapper;
import br.ucs.webalgo.middleware.application.port.in.auth.AuthUseCase;
import br.ucs.webalgo.middleware.application.port.in.auth.dto.ChangePasswordCommand;
import br.ucs.webalgo.middleware.application.port.in.auth.dto.LoginCommand;
import br.ucs.webalgo.middleware.application.port.in.auth.dto.LogoutCommand;
import br.ucs.webalgo.middleware.application.port.in.auth.dto.SignUpCommand;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping(value = "/api/v1/web-algo/auth")
public class AuthController {

    private final AuthUseCase authUseCase;
    private final LoginMapper loginMapper;
    private final LogoutMapper logoutMapper;
    private final SignUpMapper signUpMapper;
    private final ChangePasswordMapper changePasswordMapper;

    public AuthController(AuthUseCase authUseCase, LoginMapper loginMapper, LogoutMapper logoutMapper,
                          SignUpMapper signUpMapper, ChangePasswordMapper changePasswordMapper) {
        this.authUseCase = authUseCase;
        this.loginMapper = loginMapper;
        this.logoutMapper = logoutMapper;
        this.signUpMapper = signUpMapper;
        this.changePasswordMapper = changePasswordMapper;
    }

    @PostMapping("/login")
    public Mono<ResponseEntity<LoginResponse>> login(@RequestBody @Validated LoginRequest req) {
        LoginCommand command = loginMapper.toCommand(req);
        return authUseCase.login(command)
                .map(result -> {
                    LoginResponse body = loginMapper.toResponseWithoutSession(result);
                    ResponseEntity.BodyBuilder resp = ResponseEntity.ok();

                    if (result.rawSetCookie() != null && !result.rawSetCookie().isBlank()) {
                        resp.header(HttpHeaders.SET_COOKIE, result.rawSetCookie());
                    }

                    return resp.body(body);
                });
    }

    @PostMapping("/logout")
    public Mono<ResponseEntity<LogoutResponse>> logout(@RequestBody @Validated LogoutRequest req) {
        LogoutCommand command = logoutMapper.toCommand(req);
        return authUseCase.logout(command)
                .map(result -> {
                    LogoutResponse body = logoutMapper.toResponse(result);
                    ResponseEntity.BodyBuilder resp = ResponseEntity.ok();

                    resp.header(HttpHeaders.SET_COOKIE, "sessionid=; Path=/; Max-Age=0");
                    return resp.body(body);
                });
    }

    @PostMapping("/signup")
    public Mono<ResponseEntity<SignUpResponse>> register(@RequestBody @Validated SignUpRequest req) {
        SignUpCommand command = signUpMapper.toCommand(req);
        return authUseCase.register(command)
                .map(result -> {
                    SignUpResponse body = signUpMapper.toResponse(result);
                    return ResponseEntity.status(HttpStatus.CREATED).body(body);
                })
                .onErrorResume(IllegalStateException.class, ex ->
                        Mono.just(ResponseEntity.unprocessableEntity()
                                .body(new SignUpResponse(ex.getMessage()))));
    }

    @PostMapping("/change-password")
    public Mono<ResponseEntity<ChangePasswordResponse>> changePassword(@RequestBody @Validated ChangePasswordRequest req) {
        ChangePasswordCommand command = changePasswordMapper.toCommand(req);
        return authUseCase.changePassword(command)
                .map(result -> {
                    var body = changePasswordMapper.toResponse(result);
                    return ResponseEntity.ok(body);
                })
                .onErrorResume(IllegalStateException.class, ex ->
                        Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                .body(new ChangePasswordResponse(ex.getMessage()))));
    }

}