package br.ucs.webalgo.middleware.adapter.out.integration.auth.mapper;

import br.ucs.webalgo.middleware.application.port.in.auth.dto.LoginResult;
import br.ucs.webalgo.middleware.shared.util.CookieUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

@Component
public class LegacyAuthMapper {

    private final ObjectMapper om = new ObjectMapper();

    public LoginResult fromLegacyEntity(ResponseEntity<String> entity) {
        String setCookie = entity.getHeaders().getFirst(HttpHeaders.SET_COOKIE);
        String sessionId = CookieUtils.extractCookieValue(setCookie, "sessionid");

        String username = null;
        try {
            username = om.readTree(entity.getBody()).path("respostas").asText(null);
        } catch (Exception ignored) {
        }

        return new LoginResult(sessionId, username, setCookie);
    }

}
