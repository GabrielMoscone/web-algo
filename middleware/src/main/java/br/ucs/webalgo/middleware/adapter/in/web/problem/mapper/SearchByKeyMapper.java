package br.ucs.webalgo.middleware.adapter.in.web.problem.mapper;

import br.ucs.webalgo.middleware.adapter.in.web.problem.dto.SearchByKeyResponse;
import br.ucs.webalgo.middleware.application.port.in.problem.dto.SearchByKeyCommand;
import br.ucs.webalgo.middleware.application.port.in.problem.dto.SearchByKeyResult;
import org.springframework.stereotype.Component;

@Component
public class SearchByKeyMapper {

    public SearchByKeyCommand toCommand(String key, String sessionId, String username) {
        return new SearchByKeyCommand(key, sessionId, username);
    }

    public SearchByKeyResponse toResponse(SearchByKeyResult res) {
        return new SearchByKeyResponse(res.codes(), null);
    }
}
