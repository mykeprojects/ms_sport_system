import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import type { SkillCategory } from '../../catalog/catalog.types';

const SKILL_CATEGORIES: SkillCategory[] = ['Física', 'Técnica', 'Táctica', 'Mental'];

export class SaveHabilidadDto {
  @IsString()
  @IsNotEmpty({ message: 'Este campo es obligatorio.' })
  @MaxLength(120)
  name: string;

  @IsIn(SKILL_CATEGORIES, { message: 'La categoría debe ser Física, Técnica, Táctica o Mental.' })
  category: SkillCategory;

  @IsString()
  @IsNotEmpty({ message: 'Este campo es obligatorio.' })
  @MaxLength(250)
  description: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  glyph?: string;
}
