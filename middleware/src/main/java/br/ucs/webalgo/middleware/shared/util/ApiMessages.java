package br.ucs.webalgo.middleware.shared.util;

import java.util.regex.Pattern;

public final class ApiMessages {

    static final Pattern OK_PATTERN = Pattern.compile("(sucesso)",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);

    static final Pattern ERR_PATTERN = Pattern.compile("(erro|inválido|falha|nao)",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);

    public static boolean isSuccess(String msg) {
        return msg != null && OK_PATTERN.matcher(msg).find() && !ERR_PATTERN.matcher(msg).find();
    }
}
