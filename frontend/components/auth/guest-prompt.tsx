'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LogIn, UserPlus } from 'lucide-react'

interface GuestPromptProps {
  title?: string
  description: string
}

export function GuestPrompt({ title = 'Inicia sesión para continuar', description }: GuestPromptProps) {
  return (
    <Card className="max-w-lg mx-auto border-dashed border-2 shadow-none bg-gray-50/50">
      <CardHeader className="text-center">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardHeader>
      <CardContent className="text-center text-xs text-muted-foreground">
        Puedes navegar por el menú como invitado; las funciones de gestión requieren una cuenta.
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-2 justify-center">
        <Button asChild>
          <Link href="/login" className="flex items-center gap-2">
            <LogIn className="h-4 w-4" />
            Iniciar sesión
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/register" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Registrarse
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
