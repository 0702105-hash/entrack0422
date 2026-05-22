import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see \App\Http\Controllers\ProgramsController::store
 * @see app/Http/Controllers/ProgramsController.php:11
 * @route '/programs'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: store.url(options),
    method: 'get',
})

store.definition = {
    methods: ["get","head"],
    url: '/programs',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ProgramsController::store
 * @see app/Http/Controllers/ProgramsController.php:11
 * @route '/programs'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProgramsController::store
 * @see app/Http/Controllers/ProgramsController.php:11
 * @route '/programs'
 */
store.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: store.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ProgramsController::store
 * @see app/Http/Controllers/ProgramsController.php:11
 * @route '/programs'
 */
store.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: store.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ProgramsController::store
 * @see app/Http/Controllers/ProgramsController.php:11
 * @route '/programs'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: store.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ProgramsController::store
 * @see app/Http/Controllers/ProgramsController.php:11
 * @route '/programs'
 */
        storeForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: store.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ProgramsController::store
 * @see app/Http/Controllers/ProgramsController.php:11
 * @route '/programs'
 */
        storeForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: store.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\ProgramsController::manage
 * @see app/Http/Controllers/ProgramsController.php:35
 * @route '/programs/manage'
 */
export const manage = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: manage.url(options),
    method: 'get',
})

manage.definition = {
    methods: ["get","head"],
    url: '/programs/manage',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ProgramsController::manage
 * @see app/Http/Controllers/ProgramsController.php:35
 * @route '/programs/manage'
 */
manage.url = (options?: RouteQueryOptions) => {
    return manage.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProgramsController::manage
 * @see app/Http/Controllers/ProgramsController.php:35
 * @route '/programs/manage'
 */
manage.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: manage.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ProgramsController::manage
 * @see app/Http/Controllers/ProgramsController.php:35
 * @route '/programs/manage'
 */
manage.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: manage.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ProgramsController::manage
 * @see app/Http/Controllers/ProgramsController.php:35
 * @route '/programs/manage'
 */
    const manageForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: manage.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ProgramsController::manage
 * @see app/Http/Controllers/ProgramsController.php:35
 * @route '/programs/manage'
 */
        manageForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: manage.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ProgramsController::manage
 * @see app/Http/Controllers/ProgramsController.php:35
 * @route '/programs/manage'
 */
        manageForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: manage.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    manage.form = manageForm
/**
* @see \App\Http\Controllers\ProgramsController::edit
 * @see app/Http/Controllers/ProgramsController.php:0
 * @route '/programs/{program}/edit'
 */
export const edit = (args: { program: string | number } | [program: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/programs/{program}/edit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ProgramsController::edit
 * @see app/Http/Controllers/ProgramsController.php:0
 * @route '/programs/{program}/edit'
 */
edit.url = (args: { program: string | number } | [program: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { program: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    program: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        program: args.program,
                }

    return edit.definition.url
            .replace('{program}', parsedArgs.program.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProgramsController::edit
 * @see app/Http/Controllers/ProgramsController.php:0
 * @route '/programs/{program}/edit'
 */
edit.get = (args: { program: string | number } | [program: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ProgramsController::edit
 * @see app/Http/Controllers/ProgramsController.php:0
 * @route '/programs/{program}/edit'
 */
edit.head = (args: { program: string | number } | [program: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ProgramsController::edit
 * @see app/Http/Controllers/ProgramsController.php:0
 * @route '/programs/{program}/edit'
 */
    const editForm = (args: { program: string | number } | [program: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: edit.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ProgramsController::edit
 * @see app/Http/Controllers/ProgramsController.php:0
 * @route '/programs/{program}/edit'
 */
        editForm.get = (args: { program: string | number } | [program: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ProgramsController::edit
 * @see app/Http/Controllers/ProgramsController.php:0
 * @route '/programs/{program}/edit'
 */
        editForm.head = (args: { program: string | number } | [program: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    edit.form = editForm
/**
* @see \App\Http\Controllers\ProgramsController::update
 * @see app/Http/Controllers/ProgramsController.php:74
 * @route '/programs/{program}'
 */
export const update = (args: { program: number | { program_id: number } } | [program: number | { program_id: number } ] | number | { program_id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/programs/{program}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\ProgramsController::update
 * @see app/Http/Controllers/ProgramsController.php:74
 * @route '/programs/{program}'
 */
update.url = (args: { program: number | { program_id: number } } | [program: number | { program_id: number } ] | number | { program_id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { program: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'program_id' in args) {
            args = { program: args.program_id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    program: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        program: typeof args.program === 'object'
                ? args.program.program_id
                : args.program,
                }

    return update.definition.url
            .replace('{program}', parsedArgs.program.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProgramsController::update
 * @see app/Http/Controllers/ProgramsController.php:74
 * @route '/programs/{program}'
 */
update.put = (args: { program: number | { program_id: number } } | [program: number | { program_id: number } ] | number | { program_id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\ProgramsController::update
 * @see app/Http/Controllers/ProgramsController.php:74
 * @route '/programs/{program}'
 */
    const updateForm = (args: { program: number | { program_id: number } } | [program: number | { program_id: number } ] | number | { program_id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ProgramsController::update
 * @see app/Http/Controllers/ProgramsController.php:74
 * @route '/programs/{program}'
 */
        updateForm.put = (args: { program: number | { program_id: number } } | [program: number | { program_id: number } ] | number | { program_id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    update.form = updateForm
/**
* @see \App\Http\Controllers\ProgramsController::destroy
 * @see app/Http/Controllers/ProgramsController.php:95
 * @route '/programs/{program}'
 */
export const destroy = (args: { program: number | { program_id: number } } | [program: number | { program_id: number } ] | number | { program_id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/programs/{program}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\ProgramsController::destroy
 * @see app/Http/Controllers/ProgramsController.php:95
 * @route '/programs/{program}'
 */
destroy.url = (args: { program: number | { program_id: number } } | [program: number | { program_id: number } ] | number | { program_id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { program: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'program_id' in args) {
            args = { program: args.program_id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    program: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        program: typeof args.program === 'object'
                ? args.program.program_id
                : args.program,
                }

    return destroy.definition.url
            .replace('{program}', parsedArgs.program.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProgramsController::destroy
 * @see app/Http/Controllers/ProgramsController.php:95
 * @route '/programs/{program}'
 */
destroy.delete = (args: { program: number | { program_id: number } } | [program: number | { program_id: number } ] | number | { program_id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\ProgramsController::destroy
 * @see app/Http/Controllers/ProgramsController.php:95
 * @route '/programs/{program}'
 */
    const destroyForm = (args: { program: number | { program_id: number } } | [program: number | { program_id: number } ] | number | { program_id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ProgramsController::destroy
 * @see app/Http/Controllers/ProgramsController.php:95
 * @route '/programs/{program}'
 */
        destroyForm.delete = (args: { program: number | { program_id: number } } | [program: number | { program_id: number } ] | number | { program_id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const programs = {
    store: Object.assign(store, store),
manage: Object.assign(manage, manage),
edit: Object.assign(edit, edit),
update: Object.assign(update, update),
destroy: Object.assign(destroy, destroy),
}

export default programs