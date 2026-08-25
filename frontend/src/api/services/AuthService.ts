/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { main_LoginRequest } from '../models/main_LoginRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthService {
    /**
     * Login com Google
     * Inicia o fluxo de autenticação OAuth2 com o Google
     * @returns void
     * @throws ApiError
     */
    public static getAuthGoogle(): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/auth/google',
            errors: {
                307: `Temporary Redirect`,
            },
        });
    }
    /**
     * Callback do Google OAuth2
     * Processa o retorno do Google após o consentimento
     * @returns void
     * @throws ApiError
     */
    public static getAuthGoogleCallback(): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/auth/google/callback',
            errors: {
                302: `Found`,
            },
        });
    }
    /**
     * Login com Email e Senha
     * Realiza autenticação com e-mail e senha
     * @param request Credenciais do usuário
     * @returns string OK
     * @throws ApiError
     */
    public static postAuthLogin(
        request: main_LoginRequest,
    ): CancelablePromise<Record<string, string>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/auth/login',
            body: request,
            errors: {
                400: `Bad Request`,
            },
        });
    }
}
